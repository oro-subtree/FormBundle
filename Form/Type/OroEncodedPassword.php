<?php

namespace Oro\Bundle\FormBundle\Form\Type;

use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

use Oro\Bundle\SecurityBundle\Encoder\Mcrypt;

class OroEncodedPassword extends PasswordType
{
    /** @var Mcrypt */
    protected $encryptor;

    /**
     * @param Mcrypt $encryptor
     */
    public function __construct(Mcrypt $encryptor)
    {
        $this->encryptor = $encryptor;
    }

    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        parent::buildForm($builder, $options);

        $builder->addEventListener(FormEvents::PRE_SUBMIT, $this->getEncryptClosure($options));
    }

    /**
     * @param array $options
     *
     * @return callable
     */
    protected function getEncryptClosure($options)
    {
        $enc = $this->encryptor;
        $isEncode = !empty($options['encode']) && $options['encode'];

        return function (FormEvent $event) use ($enc, $isEncode) {
            $form = $event->getForm();
            $password = $event->getData();
            $oldPassword = $form->getData();

            if (empty($password) && $oldPassword) {
                // populate old password
                $password = $oldPassword;
            } elseif (!empty($password) && $isEncode) {
                $password = $this->encryptor->encryptData($password);
            }

            $event->setData($password);
        };
    }

    /**
     * {@inheritdoc}
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        parent::setDefaultOptions($resolver);

        $resolver->setDefaults([
            'encode' => true,
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function getParent()
    {
        return 'password';
    }

    /**
     * {@inheritdoc}
     */
    public function getName()
    {
        return 'oro_encoded_password';
    }
}
